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
import DeleteFlowButton from '@/components/FlowList/DeleteFlowButton';
import type { Flow } from '@/features/flows/types';
import { useNavigate } from 'react-router-dom';

interface FlowListProps {
  flows: Flow[];
}

const FlowList: React.FC<FlowListProps> = ({ flows }) => {

  const navigate = useNavigate();

  const handleFlowClick = (flow: Flow) => {
    navigate(`/flow/${flow.flow_id}`);
  };

  return (
    <div className="mt-8">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">FLOW</TableHead>
            <TableHead>TRẠNG THÁI</TableHead>
            <TableHead className="text-right">THAO TÁC</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {flows.map(flow => (
            <TableRow key={flow.flow_id}>
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
                  variant={flow.is_active ? 'default' : 'secondary'}
                  className={
                    flow.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }
                >
                  <span
                    className={`h-2 w-2 rounded-full ${flow.is_active ? 'bg-green-500' : 'bg-gray-500'} mr-1`}
                  ></span>
                  {flow.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button onClick={() => handleFlowClick(flow)} variant="ghost" size="icon" className="mr-2">
                  🚀
                </Button>
                <DeleteFlowButton flowId={flow.flow_id} flowName={flow.name} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FlowList;