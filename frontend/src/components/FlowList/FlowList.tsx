import React, { useState } from 'react';
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
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (flowId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(flowId)) {
      newExpandedRows.delete(flowId);
    } else {
      newExpandedRows.add(flowId);
    }
    setExpandedRows(newExpandedRows);
  };

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
            <React.Fragment key={flow.flow_id}>
              <TableRow className="group">
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
                  <Button
                    onClick={() => toggleRow(flow.flow_id)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    {expandedRows.has(flow.flow_id) ? '▲' : '▼'}
                  </Button>
                  <DeleteFlowButton flowId={flow.flow_id} flowName={flow.name} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="p-0">
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      expandedRows.has(flow.flow_id) ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="bg-gray-50 p-6 border-t border-gray-200">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Chi tiết dòng chảy</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">ID:</span>
                              <span className="ml-2 text-gray-900">{flow.flow_id}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Ngày tạo:</span>
                              <span className="ml-2 text-gray-900">
                                {new Date(flow.created_at).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Số lượng nút:</span>
                              <span className="ml-2 text-gray-900">{flow.node_count !== undefined ? flow.node_count : 'Không có số lượng nút'}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Trạng thái:</span>
                              <span className="ml-2 text-gray-900">
                                {flow.is_active ? 'Đang hoạt động' : 'Tạm dừng'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Mô tả</h4>
                          <p className="text-gray-700 text-sm">{flow.description}</p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Tình trạng</h4>
                          <div className="flex items-center space-x-2">
                            <span className={`h-2 w-2 rounded-full ${flow.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                            <span className="text-gray-700 text-sm">
                              {flow.is_active ? 'Dòng chảy đang hoạt động' : 'Dòng chảy tạm dừng'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default FlowList;