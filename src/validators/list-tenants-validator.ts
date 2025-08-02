import { checkSchema } from "express-validator";

export default checkSchema({
    q: {
        trim: true,
        customSanitizer: {
            options: (value) => {
                return value ? String(value).trim() : "";
            },
        },
    },
    perPage: {
        customSanitizer: {
            options: (value) => {
                const parsedValue = Number(value);
                return Number.isNaN(parsedValue) ? 6 : parsedValue;
            },
        },
    },
    currentPage: {
        customSanitizer: {
            options: (value) => {
                const parsedValue = Number(value);
                return Number.isNaN(parsedValue) ? 1 : parsedValue;
            },
        },
    },
});
