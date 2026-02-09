import { Suspense } from "react";
import SigninClient from "./SigninClient";

export default function SigninPage() {
  return (
    <Suspense fallback={null}>
      <SigninClient />
    </Suspense>
  );
}
