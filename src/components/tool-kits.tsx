import { Loader2, Upload } from 'lucide-react';
import { useLoadFile } from '@/hooks/useLoadFile';
import { Button } from './ui/button';

export default function ToolKits() {
  const { loading, loadUserPromptedFiles } = useLoadFile();

  return (
    <>
      <Button
        disabled={loading}
        variant="ghost"
        size="icon"
        onClick={loadUserPromptedFiles}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Upload />}
      </Button>
    </>
  );
}
