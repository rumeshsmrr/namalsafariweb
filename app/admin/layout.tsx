import { ReactNode } from "react";
import SessionWrapper from "../Components/SessionWrapper";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <SessionWrapper>{children}</SessionWrapper>;
}
