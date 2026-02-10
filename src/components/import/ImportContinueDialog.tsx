import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, XCircle, ArrowRight, X } from "lucide-react";

interface ImportContinueDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  cancelFunction: () => void;
  continueFunction: () => void;
  title: string;
  description: string;
  studentName?: string;
  errorMessage?: string;
}

export default function ImportContinueDialog({
  open,
  setOpen,
  cancelFunction,
  continueFunction,
  title,
  description,
  studentName,
  errorMessage,
}: ImportContinueDialogProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="shrink-0">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error Details */}
          {studentName && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-start space-x-3">
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-red-800">
                    Import Gagal untuk Siswa:
                  </h4>
                  <p className="text-sm font-semibold text-red-900 mt-1">
                    {studentName}
                  </p>
                  {errorMessage && (
                    <p className="text-xs text-red-700 mt-2 bg-red-100 rounded p-2">
                      <strong>Error:</strong> {errorMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <DialogDescription className="text-sm text-gray-700 leading-relaxed">
              {description}
            </DialogDescription>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              variant="outline"
              onClick={cancelFunction}
              className="flex-1 flex items-center justify-center space-x-2 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              <span>Hentikan Import</span>
            </Button>
            <Button
              onClick={continueFunction}
              className="flex-1 flex items-center justify-center space-x-2 bg-primary hover:bg-primary/90"
            >
              <ArrowRight className="h-4 w-4" />
              <span>Lanjutkan Import</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
