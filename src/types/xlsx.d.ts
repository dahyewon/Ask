declare module "xlsx" {
  export type WorkBook = {
    SheetNames: string[];
    Sheets: Record<string, unknown>;
  };

  export const read: (data: ArrayBuffer, options: { type: "array" }) => WorkBook;
  export const utils: {
    sheet_to_json: <T = unknown[]>(sheet: unknown, options: { header: 1; defval: string }) => T[];
  };
}
