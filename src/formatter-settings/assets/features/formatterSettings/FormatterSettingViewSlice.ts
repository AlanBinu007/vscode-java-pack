// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.

import { createSlice } from "@reduxjs/toolkit";
import { SupportedSettings } from "../../../FormatterConstants";
import { Catagory, ExampleKind, JavaFormatterSetting } from "../../../types";
import { changeExampleKind } from "../../vscode.api";

export const formatterSettingsViewSlice = createSlice({
  name: "formatterSettings",
  initialState: {
    activeCatagory: Catagory.Common,
    activePreviewExampleKind: ExampleKind.COMMON_EXAMPLE,
    settings: [] as JavaFormatterSetting[],
    exampleKind: ExampleKind.COMMON_EXAMPLE,
    formattedContent: "",
    format: false,
  },
  reducers: {
    changeActiveCatagory: (state, action) => {
      const activeCatagory: Catagory = action.payload as Catagory;
      state.activeCatagory = activeCatagory;
      switch (activeCatagory) {
        case Catagory.Blankline:
          state.exampleKind = ExampleKind.BLANKLINE_EXAMPLE;
          break;
        case Catagory.Comment:
          state.exampleKind = ExampleKind.COMMENT_EXAMPLE;
          break;
        case Catagory.Common:
          state.exampleKind = ExampleKind.COMMON_EXAMPLE;
          break;
        case Catagory.Newline:
          state.exampleKind = ExampleKind.NEWLINE_EXAMPLE;
          break;
        case Catagory.Whitespace:
          state.exampleKind = ExampleKind.WHITESPACE_EXAMPLE;
          break;
        case Catagory.Wrapping:
          state.exampleKind = ExampleKind.WRAPPING_EXAMPLE;
          break;
      }
      state.format = false;
      changeExampleKind(state.exampleKind);
    },
    changePreviewExample: (state, action) => {
      if (action.payload.exampleKind !== state.activePreviewExampleKind) {
        state.activePreviewExampleKind = action.payload.exampleKind;
        state.exampleKind = state.activePreviewExampleKind;
        changeExampleKind(state.exampleKind);
      }
      state.format = false;
    },
    initSetting: (state, action) => {
      for (const setting of state.settings) {
        if (setting.id === action.payload.setting.id) {
          return;
        }
      }
      state.settings.push(action.payload.setting);
    },
    changeSetting: (state, action) => {
      for (const setting of state.settings) {
        if (setting.id === action.payload.id) {
          setting.value = action.payload.value;
          break;
        }
      }
      if (action.payload.id === SupportedSettings.TABULATION_SIZE) {
        document.documentElement.style.setProperty("--vscode-tab-size", action.payload.value);
      }
    },
    applyFormatResult: (state, action) => {
      state.formattedContent = action.payload.content;
      state.format = true;
    }
  },
});

export const {
  changeActiveCatagory,
  changePreviewExample,
  initSetting,
  changeSetting,
  applyFormatResult,
} = formatterSettingsViewSlice.actions;

export default formatterSettingsViewSlice.reducer;
