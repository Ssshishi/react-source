/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type RootTag = 0 | 1;

export const LegacyRoot = 0;
// 支持并发渲染的根节点对象，在内部用于管理和调度并发渲染过程
export const ConcurrentRoot = 1;

/**
 * ConcurrentRoot 的对象 简化：
 * const ConcurrentRoot = {
 *  current: null, // 当前正在进行渲染的FiberRoot对象
 *  pendingCommit: null, // 当前正在等待提交的FiberRoot对象
 * }
 */