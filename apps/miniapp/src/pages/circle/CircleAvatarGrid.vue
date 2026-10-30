<script setup lang="ts">
import { CIRCLE_AVATAR_PRESETS, isPresetAvatarString, presetAvatar } from "@yiqi/shared";
import { computed, ref } from "vue";

import YqCircleAvatar from "../../components/YqCircleAvatar.vue";
import YqIcon from "../../components/YqIcon.vue";
import { platform } from "../../platform";
import { toastError } from "../../utils/feedback";

/**
 * 选群头像：6 个预设图标，外加「传一张照片」（建群页和群设置共用，没有设计稿，用图标块拼）。
 * 传照片先上传（docs/decisions.md 第 23 条：正式环境到云托管对象存储），拿到地址再交给页面。
 * 选照片要在小程序后台的隐私保护指引里声明「选中的照片」（docs/platform-checklist.md）。
 */
const props = defineProps<{ modelValue: string }>();

const emit = defineEmits<{ pick: [avatar: string] }>();

const presets = CIRCLE_AVATAR_PRESETS.map(presetAvatar);
const isPhoto = computed(() => props.modelValue !== "" && !isPresetAvatarString(props.modelValue));
const uploading = ref(false);

function choosePhoto(): void {
  if (uploading.value) return;

  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    success: (res) => {
      const [path] = res.tempFilePaths as string[];
      if (path) void upload(path);
    },
  });
}

async function upload(path: string): Promise<void> {
  uploading.value = true;
  try {
    emit("pick", await platform.uploadImage(path, "circle"));
  } catch (error) {
    toastError(error);
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <view class="grid">
    <view
      v-for="avatar in presets"
      :key="avatar"
      class="cell"
      role="button"
      @click="emit('pick', avatar)"
    >
      <YqCircleAvatar :avatar="avatar" :size="48" />
      <view v-if="avatar === modelValue" class="cell__check">
        <YqIcon name="check" :size="12" />
      </view>
    </view>

    <view class="cell" role="button" aria-label="传一张照片" @click="choosePhoto">
      <YqCircleAvatar v-if="isPhoto" :avatar="modelValue" :size="48" />
      <view v-else class="cell__upload">
        <YqIcon name="camera" :size="20" color="var(--yq-color-text-secondary)" />
      </view>
      <view v-if="isPhoto" class="cell__check">
        <YqIcon name="check" :size="12" />
      </view>
    </view>
  </view>
  <text class="hint">{{ uploading ? "照片上传中…" : "最后一格可以传一张照片" }}</text>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  justify-items: center;
}

.cell {
  position: relative;
  padding: 4px;
}

.cell__upload {
  box-sizing: border-box;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yq-color-surface);
  border: var(--yq-border-dashed-thin);
  border-radius: var(--yq-radius-lg);
}

.cell__check {
  position: absolute;
  right: -2px;
  bottom: -2px;
  box-sizing: border-box;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--yq-color-accent);
  border: var(--yq-border-chip);
  border-radius: 50%;
  color: var(--yq-color-text);
}

.hint {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: var(--yq-color-text-secondary);
  text-align: center;
}
</style>
