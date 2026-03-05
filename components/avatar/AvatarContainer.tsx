"use client";

import { useEffect, useRef, useState } from "react";
import { initAvatar, destroyAvatar } from "@/lib/klleon/avatar";
import { useUIStore } from "@/stores/uiStore";

export default function AvatarContainer() {
  const setAvatarReady = useUIStore((s) => s.setAvatarReady);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const avatarRef = useRef<HTMLElement & { videoStyle?: Record<string, string>; volume?: number }>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        if (avatarRef.current) {
          avatarRef.current.videoStyle = {
            borderRadius: "0px",
            objectFit: "contain",
            width: "100%",
            height: "100%",
            maxWidth: "100%",
            maxHeight: "100%",
          };
          avatarRef.current.volume = 100;
        }

        await initAvatar();

        if (mounted) {
          setStatus("ready");
          setAvatarReady(true);
        }
      } catch (err) {
        console.error("[AvatarContainer] Init failed:", err);
        if (mounted) {
          setStatus("error");
          setErrorMsg(err instanceof Error ? err.message : String(err));
        }
      }
    }

    init();

    return () => {
      mounted = false;
      destroyAvatar();
    };
  }, [setAvatarReady]);

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
      {/* Klleon SDK custom element - MUST be in DOM before init */}
      <avatar-container
        ref={avatarRef}
        className="w-full h-full"
        style={{ zIndex: 10 }}
      />

      {/* Loading overlay */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-mcdonalds-red/80 to-[#C41E3A]/80 backdrop-blur-sm z-20">
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border-4 border-white/30 animate-pulse mx-auto">
              <div className="w-20 h-20 border-4 border-white border-t-mcdonalds-yellow rounded-full animate-spin" />
            </div>
            <p className="text-white text-lg font-medium">Loading Casey...</p>
            <p className="text-white/80 text-sm mt-1">Preparing your ordering assistant</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm z-20">
          <div className="text-center max-w-md px-6">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 border-4 border-white/30 mx-auto">
              <span className="text-6xl text-white">!</span>
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Avatar Unavailable</h3>
            <p className="text-white/90 text-sm mb-4">{errorMsg || "Failed to load avatar"}</p>
            <p className="text-white/80 text-xs">
              You can still browse and order from the menu below
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
