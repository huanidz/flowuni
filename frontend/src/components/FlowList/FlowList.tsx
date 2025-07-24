import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface Flow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused';
  lastRun: string;
  runCount: number;
  successRate: number;
}

interface FlowListProps {
  flows: Flow[];
}

const FlowList: React.FC<FlowListProps> = ({ flows }) => {
  return (
    <div className="mt-8">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">FLOW</TableHead>
            <TableHead>TRẠNG THÁI</TableHead>
            <TableHead>LẦN CHẠY CUỐI</TableHead>
            <TableHead>SỐ LẦN CHẠY</TableHead>
            <TableHead>TỶ LỆ THÀNH CÔNG</TableHead>
            <TableHead className="text-right">THAO TÁC</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flows.map(flow => (
            <TableRow key={flow.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 text-xl">
                    ⚙️
                  </div>
                  <div>
                    <div className="font-semibold">{flow.name}</div>
                    <div className="text-sm text-gray-500">
                      {flow.description}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={flow.status === 'active' ? 'default' : 'secondary'}
                  className={
                    flow.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }
                >
                  <span
                    className={`h-2 w-2 rounded-full ${flow.status === 'active' ? 'bg-green-500' : 'bg-gray-500'} mr-1`}
                  ></span>
                  {flow.status === 'active' ? 'Đang hoạt động' : 'Tạm dừng'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <span className="mr-2">🕒</span>
                  {flow.lastRun}
                </div>
              </TableCell>
              <TableCell>{flow.runCount.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex items-center">
                  <span className="mr-2">{flow.successRate}%</span>
                  <Progress value={flow.successRate} className="w-[100px]" />
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" className="mr-2">
                  {flow.status === 'active' ? '⏸️' : '▶️'}
                </Button>
                <Button variant="ghost" size="icon" className="mr-2">
                  ✏️
                </Button>
                <Button variant="ghost" size="icon">
                  🗑️
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FlowList;
