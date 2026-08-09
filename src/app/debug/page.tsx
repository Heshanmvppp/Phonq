import { AppHeader } from "@/components/layout/app-header";
export default function DebugPage() {
  return (
    <div>
      <h1>Debug header</h1>
      <AppHeader name="Test User" email="test@example.com" image="" />
      <p>check console for hydration mismatch</p>
    </div>
  );
}
