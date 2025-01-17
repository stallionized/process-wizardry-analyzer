export interface Program {
  id: string;
  client_id: string;
  program_name: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

export type CreateProgramInput = Pick<Program, 'client_id' | 'program_name' | 'description'>;
export type UpdateProgramInput = Partial<CreateProgramInput> & { id: string };