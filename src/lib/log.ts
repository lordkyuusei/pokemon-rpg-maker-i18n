export const _log = (message: any, args: any = null) => {
    console.log(`%c ${message}`, `color: hsl(280deg 100% 75%); font-weight: bold`, { args });
}

export const _warn = (message: any, args: any = null) => {
    console.log(`%c ${message}`, `color: orange; font-weight: bold`, { args });
}

export const _err = (message: any, args: any = null) => {
    console.log(`%c ${message}`, `color: red; font-weight: bold`, { args });
}