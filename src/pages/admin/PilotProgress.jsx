import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';

export default function PilotProgress() {
  const { data: progress = [], isLoading } = useQuery({
    queryKey: ['admin-progress'],
    queryFn: () => base44.entities.PilotProgress.list('-created_date'),
  });

  const { data: sectors = [] } = useQuery({
    queryKey: ['admin-sectors'],
    queryFn: () => base44.entities.TrainingSector.list(),
  });

  const getSectorName = (id) => {
    const s = sectors.find(s => s.id === id);
    return s ? s.title : 'Final Exam';
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Student Progress</h1>
        <p className="text-muted-foreground mt-1">Track student training results and exam scores.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : progress.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No progress records yet.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pilot</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progress.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.pilot_email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {p.type === 'final_exam' ? 'Final Exam' : 'Sector Test'}
                    </Badge>
                  </TableCell>
                  <TableCell>{p.type === 'sector_test' ? getSectorName(p.sector_id) : '—'}</TableCell>
                  <TableCell className="font-semibold">{p.score}%</TableCell>
                  <TableCell>
                    {p.passed ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" /> Pass
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-destructive">
                        <XCircle className="w-4 h-4" /> Fail
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.created_date ? format(new Date(p.created_date), 'MMM d, yyyy') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}