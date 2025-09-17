# Privacy Protected Dataset Flow Test Guide

## 更新的业务逻辑

### 隐私级别变更

1. **Public Dataset** - 公开数据集，任何人都可以查看和下载
2. **Private Dataset** - 私有数据集，只有特定权限的用户可以访问
3. **ZK-Proof Protected** - 使用零知识证明保护的数据集
4. **Encrypted** - 使用高级加密算法保护的数据集

### 上传流程变更

#### 标准隐私级别 (Public/Private)
1. 完成3步上传
2. 状态直接设置为 `ready`
3. 自动跳转到数据集列表

#### 特殊隐私级别 (ZK-Proof Protected/Encrypted)
1. 完成3步上传
2. 状态设置为 `uploaded` (而不是 `ready`)
3. 显示提示信息并跳转到对应处理页面：
   - **ZK-Proof Protected** → `/datasets/generate-proof?dataset_id=XXX`
   - **Encrypted** → `/datasets/encrypt?dataset_id=XXX`
4. 完成证明生成或加密后，状态更新为 `ready`

### 编辑流程变更

当从其他隐私级别修改到特殊隐私级别时：
- 数据集状态自动变为 `uploaded`
- 需要完成相应的证明生成或加密才能变为 `ready`

## 测试步骤

### 1. 测试普通隐私级别上传
1. 选择 Public 或 Private
2. 完成上传
3. 验证状态为 `ready`
4. 验证自动跳转到数据集列表

### 2. 测试 ZK Proof 隐私级别上传
1. 选择 "ZK-Proof Protected"
2. 完成上传
3. 验证状态为 `uploaded`
4. 验证跳转到 ZK 证明生成页面
5. 完成证明生成
6. 验证状态更新为 `ready`

### 3. 测试 Encrypted 隐私级别上传
1. 选择 "Encrypted"
2. 完成上传
3. 验证状态为 `uploaded`
4. 验证跳转到加密页面
5. 完成加密
6. 验证状态更新为 `ready`

### 4. 测试隐私级别修改
1. 创建一个 Public 数据集
2. 修改隐私级别为 "ZK-Proof Protected"
3. 验证状态变为 `uploaded`
4. 完成证明生成
5. 验证状态更新为 `ready`

## API 端点

### 新增端点
- `POST /api/datasets/:id/encrypt` - 加密数据集

### 修改端点
- `POST /api/datasets/:id/zk-proof` - 现在会将状态更新为 `ready`
- `PUT /api/datasets/:id` - 修改隐私级别到特殊级别时设置状态为 `uploaded`

## 前端路由

### 新增路由
- `/datasets/encrypt` - 数据集加密页面

### 修改路由
- `/datasets/generate-proof` - 从 `/zkp/generate-proof` 迁移

## 数据库变更

### datasets 表新增列
- `encryption_status TEXT` - 加密状态 (encrypted, etc.)
- `encryption_metadata TEXT` - 加密元数据 (JSON)

### 状态说明
- `draft` - 草稿保存状态（Save Draft功能）
- `processing` - 文件处理中
- `uploaded` - 文件已上传但需要额外处理（ZK证明/加密）
- `ready` - 完全可用状态
- `failed` - 处理失败

## 注意事项

1. 只有 "ZK-Proof Protected" 和 "Encrypted" 两种隐私级别需要额外处理
2. 状态必须在完成相应处理后才能从 `uploaded` 变为 `ready`
3. 编辑数据集时如果修改为特殊隐私级别，状态会自动重置为 `uploaded`
4. Save Draft 功能保存的是 `draft` 状态，用于临时保存未完成的上传 