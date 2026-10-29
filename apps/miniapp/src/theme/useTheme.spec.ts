import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** 测试里没有 uni：给一个内存版的本地缓存 */
function stubUni(initial: Record<string, unknown> = {}) {
  const storage = new Map<string, unknown>(Object.entries(initial));
  const uni = {
    getStorageSync: vi.fn((key: string) => storage.get(key) ?? ""),
    setStorageSync: vi.fn((key: string, value: unknown) => {
      storage.set(key, value);
    }),
    setBackgroundColor: vi.fn(),
  };

  vi.stubGlobal("uni", uni);
  return { uni, storage };
}

/** store 在模块加载时读缓存，每个用例重新加载一次 */
async function loadStore() {
  vi.resetModules();
  return import("./useTheme");
}

describe("主题 store", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("没有缓存时默认贴纸风", async () => {
    stubUni();
    const { useTheme } = await loadStore();

    expect(useTheme().theme.value).toBe("sticker");
    expect(useTheme().themeClass.value).toBe("yq-theme-sticker");
  });

  it("启动时同步读本地缓存，第一帧就是上次选的主题", async () => {
    stubUni({ "yq.theme": "cute" });
    const { useTheme } = await loadStore();

    expect(useTheme().theme.value).toBe("cute");
  });

  it("缓存里是认不出的值就当没有", async () => {
    stubUni({ "yq.theme": "dark" });
    const { useTheme } = await loadStore();

    expect(useTheme().theme.value).toBe("sticker");
  });

  it("切换主题：马上生效、写缓存、登录了就存到用户设置", async () => {
    const { storage } = stubUni();
    const { setTheme, setThemeSaver, useTheme } = await loadStore();
    const saver = vi.fn(() => Promise.resolve());
    setThemeSaver(saver);

    await setTheme("clean");

    expect(useTheme().theme.value).toBe("clean");
    expect(storage.get("yq.theme")).toBe("clean");
    expect(saver).toHaveBeenCalledWith("clean");
  });

  it("没登录（没有保存函数）时只存本地", async () => {
    const { storage } = stubUni();
    const { setTheme } = await loadStore();

    await setTheme("cute");

    expect(storage.get("yq.theme")).toBe("cute");
  });

  it("登录后以服务端为准，并且不再回存服务端", async () => {
    const { storage } = stubUni({ "yq.theme": "cute" });
    const { hydrateTheme, setThemeSaver, useTheme } = await loadStore();
    const saver = vi.fn(() => Promise.resolve());
    setThemeSaver(saver);

    hydrateTheme("clean");

    expect(useTheme().theme.value).toBe("clean");
    expect(storage.get("yq.theme")).toBe("clean");
    expect(saver).not.toHaveBeenCalled();
  });

  it("存服务端失败时本地已经换好，错误交给调用方提示", async () => {
    stubUni();
    const { setTheme, setThemeSaver, useTheme } = await loadStore();
    setThemeSaver(() => Promise.reject(new Error("网络不太好")));

    await expect(setTheme("cute")).rejects.toThrow("网络不太好");
    expect(useTheme().theme.value).toBe("cute");
  });
});
