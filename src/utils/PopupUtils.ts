
/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/open#window_features
 *
 * @public
 */
export interface PopupWindowFeatures {
    left?: number;
    top?: number;
    width?: number;
    height?: number;
    menubar?: boolean;
    toolbar?: boolean;
    location?: boolean;
    status?: boolean;
    resizable?: boolean;
    scrollbars?: boolean;
}

export class PopupUtils {
    static center({ ...features }: PopupWindowFeatures): PopupWindowFeatures {
        if (features.width != null)
            features.left ??= Math.max(0, Math.round(window.screenX + (window.outerWidth - features.width) / 2));
        if (features.height != null)
            features.top ??= Math.max(0, Math.round(window.screenY + (window.outerHeight - features.height) / 2));
        return features;
    }

    static serialize(features: PopupWindowFeatures): string {
        return Object.entries(features)
            .filter(([, value]) => value != null)
            .map(([key, value]) => `${key}=${typeof value === "number" ? value : value ? "yes" : "no"}`)
            .join(",");
    }
}
