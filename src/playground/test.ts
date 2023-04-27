/**
 * Simple component.
 * @author JayeeHsu
 */
export interface SimpleComponentProps {
      /**
       * Button color.
       * @category dd
       * */
      color: 'blue' | 'green';

      /**
      * Disabled
      * @default true
      * */
      isDisabled?: boolean;
}