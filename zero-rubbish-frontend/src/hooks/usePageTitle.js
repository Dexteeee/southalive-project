import { useEffect } from "react";

// Sets the browser tab title for the page it's called from, restoring the
// previous title on unmount so navigating away doesn't leave it stale.
export default function usePageTitle(title) {
    useEffect(() => {
        const previousTitle = document.title;
        document.title = title;
        return () => {
            document.title = previousTitle;
        };
    }, [title]);
}
