import * as React from "react";

export default function AppBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#090b10]">
      <div className="relative">{children}</div>
    </div>
  );
}
