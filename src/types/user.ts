export interface User {
  id: string;
  username: string;
  email: string;
  name: string | null;
  status: boolean;
  roleId: number;
  role: {
    id: number;
    name: string;
    description: string | null;
  };
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
}
