import { Signal } from '@/core/signal/Signal'

// not a great way but it works!
// we use useOnClickOutside in both pen dropdown and color palette components.
// when the outside click happens, the first handler disables the other one.
// leading color palette to not save the selected color in the storage.
// this signal avoids it
export const closeColorPalette = new Signal()
