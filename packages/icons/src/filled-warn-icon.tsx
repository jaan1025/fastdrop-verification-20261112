import { Slot } from "radix-ui"

import { mergeIconClass } from "./merge-icon-class"
import type { IconProps } from "./icon-props"

// clipPath uses a FIXED id (clip0_129_29753); rendering multiple instances on
// one page duplicates that id in the DOM — acceptable for this simple clip.
export const FilledWarnIcon = ({ className, ...rest }: IconProps) => (
  // @ts-expect-error radix Slot.Root types props as HTMLAttributes; our SVG rest widens them
  <Slot.Root className={mergeIconClass("size-6", className)} {...rest}>
    <svg width="48" height="49" viewBox="0 0 48 49" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_129_29753)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24 4.5C12.9543 4.5 4 13.4543 4 24.5C4 35.5457 12.9543 44.5 24 44.5C35.0457 44.5 44 35.5457 44 24.5C44 13.4543 35.0457 4.5 24 4.5ZM26.1164 27.374V14.0518H21.8849V27.374H26.1164ZM25.7866 30.7852C25.292 30.3089 24.6967 30.0708 24.0006 30.0708C23.2862 30.0708 22.6909 30.3089 22.2146 30.7852C21.7384 31.2797 21.5002 31.8842 21.5002 32.5986C21.5002 33.2947 21.7384 33.8809 22.2146 34.3571C22.6909 34.8334 23.2862 35.0715 24.0006 35.0715C24.6967 35.0715 25.292 34.8334 25.7866 34.3572C26.2629 33.8809 26.501 33.2947 26.501 32.5986C26.501 31.8842 26.2629 31.2797 25.7866 30.7852Z"
          fill="currentColor"
        />
      </g>
      <defs>
        <clipPath id="clip0_129_29753">
          <rect width="48" height="48" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  </Slot.Root>
)
