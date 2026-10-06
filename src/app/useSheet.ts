import { useLocation, useNavigate } from 'react-router';

interface SheetState {
  sheet?: string;
  sheetData?: unknown;
}

/**
 * A sheet that lives in history state, so Android's back gesture closes it before leaving the
 * screen. `show` pushes an entry; closing pops it.
 */
export function useSheet<T = undefined>(name: string) {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as SheetState;
  const open = state.sheet === name;

  const show = (data?: T) =>
    navigate(`${location.pathname}${location.search}`, {
      state: { ...state, sheet: name, sheetData: data },
    });
  const hide = () => {
    if (open) navigate(-1);
  };

  return {
    open,
    show,
    hide,
    onOpenChange: (next: boolean) => (next ? show() : hide()),
    data: (open ? state.sheetData : undefined) as T | undefined,
  };
}
