declare module "cmdk" {
  import type {
    ComponentType,
    Dispatch,
    ReactNode,
    SetStateAction,
  } from "react";

  type IntrinsicProps = object;

  export interface CommandDialogProps extends IntrinsicProps {
    open: boolean;
    onOpenChange: Dispatch<SetStateAction<boolean>>;
    label: string;
    children?: ReactNode;
  }

  export interface CommandInputProps extends IntrinsicProps {
    placeholder?: string;
  }

  export interface CommandListProps extends IntrinsicProps {
    children?: ReactNode;
  }

  export interface CommandEmptyProps extends IntrinsicProps {
    children?: ReactNode;
  }

  export interface CommandItemProps extends IntrinsicProps {
    value: string;
    onSelect?: (value: string) => void;
    children?: ReactNode;
  }

  export const Command: {
    Dialog: ComponentType<CommandDialogProps>;
    Input: ComponentType<CommandInputProps>;
    List: ComponentType<CommandListProps>;
    Empty: ComponentType<CommandEmptyProps>;
    Item: ComponentType<CommandItemProps>;
  };

  export default Command;
}
