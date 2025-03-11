import React, { useEffect, useState } from "react";
import { useMicroAppStore } from "@andwrobs/portal-sdk/react";
import { useNavigate, useParams } from "react-router";

export default function AccountDetail() {
  const id = useParams().id;
  const navigate = useNavigate();
  const navigateWithinApp = useMicroAppStore(
    (state) => state.navigateWithinApp
  );

  const handleClick = () => {
    navigateWithinApp("/"); // alert parent app
    navigate("/");
  };

  return (
    <div className="flex items-center p-6 gap-6">
      <div>
        <button
          className={`px-4 py-2 text-white rounded-md transition-colors cursor-pointer bg-blue-500 hover:bg-blue-600`}
          onClick={handleClick}
        >
          ⬅️ Back to /
        </button>
      </div>
      <span> ID from path: {id}</span>
    </div>
  );
}
