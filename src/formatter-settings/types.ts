// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

export interface JavaFormatterSetting {
    id: string;
    name?: string;
    value: string;
    candidates?: string[];
    catagory: Catagory;
    exampleKind: ExampleKind;
    valueKind?: ValueKind;
    // the first profile version the setting becomes valid, default is 1.
    startVersion: number;
    // the first profile version the settings becomes deprecated, if undefined, the setting is valid in the current version.
    deprecatedVersion?: number;
}

export enum ValueKind {
    Boolean,
    Number,
    Enum,
}

export enum Catagory {
    Common,
    Whitespace,
    Comment,
    Wrapping,
    Newline,
    Blankline,
    UnSupported
}

export enum ExampleKind {
    COMMON_EXAMPLE,
    BLANKLINE_EXAMPLE,
    COMMENT_EXAMPLE,
    NEWLINE_EXAMPLE,
    BRACED_CODE_EXAMPLE,
    ANNOTATION_AND_ANONYMOUS_EXAMPLE,
    WHITESPACE_EXAMPLE,
    WRAPPING_EXAMPLE,
}
