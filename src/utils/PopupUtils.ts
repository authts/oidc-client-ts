/**
 *
 * @public
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/open#window_features
 */
export interface PopupWindowFeatures {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    menubar?: boolean | string;
    toolbar?: boolean | string;
    location?: boolean | string;
    status?: boolean | string;
    resizable?: boolean | string;
    scrollbars?: boolean | string;
    /** Close popup window after time in seconds, by default it is -1. To enable this feature, set value greater than 0. */
    closePopupWindowAfterInSeconds?: number;

    [k: string]: boolean | string | number | undefined;
}

export class PopupUtils {
    /**
     * Populates a map of window features with a placement centered in front of
     * the current window. If no explicit width is given, a default value is
     * binned into [800, 720, 600, 480, 360] based on the current window's width.
     */
    static center({ ...features }: PopupWindowFeatures): PopupWindowFeatures {
        if (features.width == null)
            features.width = [800, 720, 600, 480].find(width => width <= window.outerWidth / 1.618) ?? 360;
        features.left ??= Math.max(0, Math.round(window.screenX + (window.outerWidth - features.width) / 2));
        if (features.height != null)
            features.top ??= Math.max(0, Math.round(window.screenY + (window.outerHeight - features.height) / 2));
        return features;
    }

    static serialize(features: PopupWindowFeatures): string {
        return Object.entries(features)
            .filter(([, value]) => value != null)
            .map(([key, value]) => `${key}=${typeof value !== "boolean" ? value as string : value ? "yes" : "no"}`)
            .join(",");
    }
}
