import { createAccountWork } from "@/lib/privacy";
import { useLayoutEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Work belongs to this mounted account, including across logout/login as the same user. */
export function useAccountLifetime(accountId: string) {
  const lifetime = useMemo(() => {
    const state = { active: true, generation: 0, controllers: new Set<{ abort: () => void }>() };
    const invalidate = () => {
      state.active = false;
      state.generation++;
      state.controllers.forEach(controller => controller.abort());
      state.controllers.clear();
    };
    return {
      accountId,
      state,
      invalidate,
      isCurrent: () => state.active,
      start() {
        const generation = state.generation;
        const work = createAccountWork();
        const controller = { abort: work.cancel };
        const isCurrent = () => state.active && state.generation === generation && work.isCurrent();
        if (isCurrent()) state.controllers.add(controller);
        else controller.abort();
        return {
          signal: work.signal,
          isCurrent,
          assertCurrent() {
            if (!isCurrent()) throw new DOMException("Account changed", "AbortError");
          },
          finish: () => { state.controllers.delete(controller); work.finish(); },
        };
      },
    };
  }, [accountId]);

  useLayoutEffect(() => {
    lifetime.state.active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || session?.user.id !== accountId) lifetime.invalidate();
    });
    return () => {
      lifetime.invalidate();
      subscription.unsubscribe();
    };
  }, [accountId, lifetime]);

  return lifetime;
}
