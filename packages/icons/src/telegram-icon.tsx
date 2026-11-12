import { Slot } from "radix-ui"

import { mergeIconClass } from "./merge-icon-class"
import type { IconProps } from "./icon-props"

export const TelegramIcon = ({ className, ...rest }: IconProps) => (
  // @ts-expect-error radix Slot.Root types props as HTMLAttributes; our SVG rest widens them
  <Slot.Root className={mergeIconClass("size-6", className)} {...rest}>
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M9.68912 18.9092L9.97845 14.4705L17.9331 7.20918C18.2851 6.88385 17.8611 6.72718 17.3951 7.00985L7.57645 13.2959L3.32979 11.9312C2.41912 11.6698 2.40845 11.0285 3.53779 10.5665L20.0771 4.10385C20.8338 3.75785 21.5585 4.29252 21.2685 5.46785L18.4511 18.9092C18.2545 19.8632 17.6845 20.0945 16.8978 19.6538L12.6098 16.4432L10.5498 18.4685C10.3111 18.7092 10.1138 18.9092 9.68979 18.9092H9.68912Z"
        fill="currentColor"
      />
    </svg>
  </Slot.Root>
)
