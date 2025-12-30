import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="container mx-auto px-4 py-12 flex justify-center">
          <div className="w-full max-w-md p-8 bg-gray-800 rounded-lg shadow-md border border-gray-600">
            <h1 className="text-2xl font-bold mb-4 text-center text-white">Conferma email</h1>
            <p className="text-gray-200 text-center mb-6">Verifica in corso...</p>
          </div>
        </main>
      }
    >
      <VerifyEmailClient />
    </Suspense>
  );
}
