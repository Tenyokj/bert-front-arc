export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    const previous = document.activeElement;
    const field = document.createElement("textarea");
    field.value = value;
    field.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    if (previous instanceof HTMLElement) previous.focus();
    return copied;
  } catch {
    return false;
  }
}
