# webrtc-playground

learn webrtc

游戏逻辑
--------

一个标准的 1v1 游戏逻辑：

1. A 登录游戏
2. A 创建 offer
3. 连接信令服务器
4. 发送 offer 给信令服务器
5. 信令服务器存储 offer，发送 game_id 给 A
6. A 得到 game_id，生成对战链接，发送给 B
7. B 登录游戏后，请求信令服务器，获取 offer，生成 answer，发给信令服务器
8. 信令服务器通知 A，B 已经登录，同时发送 answer
9. A 使用 answer 建立链接
10. A 建立 senderDataChannel，尝试连接 B
11. B 接到消息后，建立 receiverDataChannel
12. AB 开始协商进行游戏

### 断线的逻辑

### 多人游戏
