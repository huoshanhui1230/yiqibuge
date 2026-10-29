import type { AvatarPerson } from "../components/types";

/**
 * 设计稿里反复出现的几个人，H5 预览的假数据和组件演示页共用。
 *
 * id 是特意挑的：字母头像的底色按 id 的哈希取（shared 的 avatarColorIndex），
 * 这样挑出来的 id 正好落在设计稿给这个人画的颜色上（杰是桃色、王是天蓝……），
 * 截图才能和设计稿对上。改 id 之前先跑一下 avatarColorIndex 看看落在哪个颜色。
 */
export const PEOPLE = {
  /** 阿杰：大学室友的群主，H5 预览里的「我」 */
  jie: { id: "u-jie-9", name: "阿杰" },
  li: { id: "u-li", name: "莉莉" },
  zhuang: { id: "u-zhuang-4", name: "大壮" },
  mei: { id: "u-mei-9", name: "美美" },
  chen: { id: "u-chen-2", name: "老陈" },
  wang: { id: "u-wang-8", name: "小王" },
  lin: { id: "u-lin-7", name: "林林" },
  zhou: { id: "u-zhou-9", name: "周周" },
  liu: { id: "u-liu-5", name: "大刘" },
  mom: { id: "u-ma-9", name: "妈妈" },
  xiaolin: { id: "u-xiaolin-8", name: "小林" },
} satisfies Record<string, AvatarPerson>;
