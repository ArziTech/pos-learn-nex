import { Button } from "@/components/ui/button";
import { FileBadge, Upload } from "lucide-react";
import { ChangeEvent, RefObject } from "react";

interface FileUploadAreaProps {
  file: File | null;
  dragActive: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onUploadAreaClick: () => void;
}

export default function FileUploadArea({
  file,
  dragActive,
  fileInputRef,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onFileChange,
  onUploadAreaClick,
}: FileUploadAreaProps) {
  return (
    <div
      className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer ${
        dragActive ? "bg-blue-100" : ""
      }`}
      onClick={onUploadAreaClick}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {file ? (
        <FileBadge className="mx-auto h-12 w-12 text-gray-400" />
      ) : (
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
      )}
      <p className="mt-2 text-sm text-gray-600">
        Drag and drop file Excel atau klik area ini untuk memilih
      </p>
      {file && <p className="mt-2 text-sm">{file.name}</p>}

      <input
        type="file"
        accept=".xlsx"
        style={{ display: "none" }}
        onChange={onFileChange}
        ref={fileInputRef}
      />

      <Button
        variant="outline"
        className="mt-2"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUploadAreaClick();
        }}
      >
        Pilih File
      </Button>
    </div>
  );
}
