import { ImportExportContainer } from "@/features/import-export";

interface AdminImportExportProps {
  embedded?: boolean;
}

export default function AdminImportExport({ embedded = false }: AdminImportExportProps) {
  return <ImportExportContainer embedded={embedded} />;
}
