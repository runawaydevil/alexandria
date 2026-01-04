/**
 * Decode base64 string to UTF-8 string
 * Handles emojis and special characters correctly by using TextDecoder
 * 
 * @param base64 - Base64 encoded string
 * @returns Decoded UTF-8 string
 */
export function decodeBase64ToUTF8(base64: string): string {
  // Remove newlines from base64 string
  const cleanBase64 = base64.replace(/\n/g, '')
  
  // Decode base64 to binary string
  const binaryString = atob(cleanBase64)
  
  // Convert binary string to Uint8Array
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  // Decode UTF-8 using TextDecoder
  const decoder = new TextDecoder('utf-8')
  return decoder.decode(bytes)
}

