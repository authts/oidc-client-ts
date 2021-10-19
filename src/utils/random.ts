const UUID_V4_TEMPLATE = "10000000-1000-4000-8000-100000000000";

/**
 * Generates RFC4122 version 4 guid ()
 */
function _cryptoUuidv4() {
    return UUID_V4_TEMPLATE.replace(/[018]/g, c =>
        (+c ^ window.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

function _uuidv4() {
    return UUID_V4_TEMPLATE.replace(/[018]/g, c =>
        (+c ^ Math.random() * 16 >> +c / 4).toString(16)
    );
}

export function random(): string {
    const hasRandomValues = window.crypto && Object.prototype.hasOwnProperty.call(window.crypto, "getRandomValues");
    const uuid = hasRandomValues ? _cryptoUuidv4() : _uuidv4();
    return uuid.replace(/-/g, "");
}
