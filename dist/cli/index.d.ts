declare const cli: (options: {
    testing?: boolean | undefined;
    cliArgs: string[];
}) => Promise<number>;
export default cli;
