import React, { useEffect, useState } from "react";
import { useMicroAppStore } from "@andwrobs/portal-sdk/react";
import { useNavigate, useParams } from "react-router";

export default function Accounts() {
  const id = useParams().id;
  const navigate = useNavigate();
  const navigateWithinApp = useMicroAppStore(
    (state) => state.navigateWithinApp
  );

  const handleClick = (routePath: string) => {
    navigateWithinApp(routePath); // alert parent app
    navigate(routePath);
  };

  return (
    <div className="flex flex-col items-center p-6 gap-6">
      <h1>Accounts</h1>

      <div className="flex items-center gap-6">
        <button
          className={`px-4 py-2 text-white rounded-md transition-colors cursor-pointer bg-blue-500 hover:bg-blue-600`}
          onClick={() => handleClick("/")}
        >
          ⬅️ Back to /
        </button>
        <button
          className={`px-4 py-2 text-white rounded-md transition-colors cursor-pointer bg-blue-500 hover:bg-blue-600`}
          onClick={() => handleClick("/accounts/123")}
        >
          To Account 123
        </button>
      </div>
    </div>
  );
}
