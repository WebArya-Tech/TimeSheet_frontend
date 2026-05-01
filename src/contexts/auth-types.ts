export type UserRole = "super_admin" | "admin" | "user";

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    employeeCode: string;
    role: UserRole;
    department: string;
    designation: string;
}
