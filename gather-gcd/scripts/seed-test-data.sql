-- 测试数据脚本 - 在 Supabase SQL Editor 中运行
-- 创建一个测试活动和多个用户的选择数据

-- 1. 创建测试活动
INSERT INTO events (id, title, passcode, start_date, is_locked, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '周末团建活动',
  '1234',
  CURRENT_DATE,
  false,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  passcode = EXCLUDED.passcode,
  start_date = EXCLUDED.start_date;

-- 2. 插入测试用户的选择数据
-- 用户1: 小明 - 选择了多个时段
INSERT INTO responses (event_id, nickname, user_fingerprint, availability, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '小明',
  'fingerprint_xiaoming_001',
  jsonb_build_object(
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), '["morning", "afternoon"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '1 day', 'YYYY-MM-DD'), '["morning", "evening"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '2 days', 'YYYY-MM-DD'), '["afternoon"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '5 days', 'YYYY-MM-DD'), '["morning", "afternoon", "evening"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '14 days', 'YYYY-MM-DD'), '["morning"]'::jsonb
  ),
  NOW()
)
ON CONFLICT (event_id, nickname) DO UPDATE SET
  availability = EXCLUDED.availability,
  updated_at = NOW();

-- 用户2: 小红 - 选择了部分重叠的时段
INSERT INTO responses (event_id, nickname, user_fingerprint, availability, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '小红',
  'fingerprint_xiaohong_002',
  jsonb_build_object(
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), '["morning", "evening"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '1 day', 'YYYY-MM-DD'), '["morning", "afternoon"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '3 days', 'YYYY-MM-DD'), '["afternoon", "evening"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '5 days', 'YYYY-MM-DD'), '["morning", "afternoon"]'::jsonb
  ),
  NOW()
)
ON CONFLICT (event_id, nickname) DO UPDATE SET
  availability = EXCLUDED.availability,
  updated_at = NOW();

-- 用户3: 小李 - 选择了较少时段
INSERT INTO responses (event_id, nickname, user_fingerprint, availability, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '小李',
  'fingerprint_xiaoli_003',
  jsonb_build_object(
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), '["morning"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '5 days', 'YYYY-MM-DD'), '["morning", "afternoon", "evening"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '6 days', 'YYYY-MM-DD'), '["evening"]'::jsonb
  ),
  NOW()
)
ON CONFLICT (event_id, nickname) DO UPDATE SET
  availability = EXCLUDED.availability,
  updated_at = NOW();

-- 用户4: 小王 - 选择了周末时段
INSERT INTO responses (event_id, nickname, user_fingerprint, availability, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  '小王',
  'fingerprint_xiaowang_004',
  jsonb_build_object(
    TO_CHAR(CURRENT_DATE + INTERVAL '5 days', 'YYYY-MM-DD'), '["morning", "afternoon"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '6 days', 'YYYY-MM-DD'), '["morning", "afternoon", "evening"]'::jsonb
  ),
  NOW()
)
ON CONFLICT (event_id, nickname) DO UPDATE SET
  availability = EXCLUDED.availability,
  updated_at = NOW();

-- 用户5: Alice - 英文名用户
INSERT INTO responses (event_id, nickname, user_fingerprint, availability, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Alice',
  'fingerprint_alice_005',
  jsonb_build_object(
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), '["morning", "afternoon", "evening"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '1 day', 'YYYY-MM-DD'), '["morning"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '5 days', 'YYYY-MM-DD'), '["afternoon", "evening"]'::jsonb
  ),
  NOW()
)
ON CONFLICT (event_id, nickname) DO UPDATE SET
  availability = EXCLUDED.availability,
  updated_at = NOW();

-- 用户6: Bob - 另一个英文名用户
INSERT INTO responses (event_id, nickname, user_fingerprint, availability, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Bob',
  'fingerprint_bob_006',
  jsonb_build_object(
    TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'), '["morning"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '2 days', 'YYYY-MM-DD'), '["afternoon", "evening"]'::jsonb,
    TO_CHAR(CURRENT_DATE + INTERVAL '5 days', 'YYYY-MM-DD'), '["morning"]'::jsonb
  ),
  NOW()
)
ON CONFLICT (event_id, nickname) DO UPDATE SET
  availability = EXCLUDED.availability,
  updated_at = NOW();

-- 查看插入结果
SELECT
  e.title as "活动名称",
  e.passcode as "口令",
  e.id as "活动ID",
  COUNT(r.id) as "参与人数"
FROM events e
LEFT JOIN responses r ON e.id = r.event_id
WHERE e.id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
GROUP BY e.id, e.title, e.passcode;

-- 查看所有用户选择
SELECT
  nickname as "用户",
  availability as "选择的时段"
FROM responses
WHERE event_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ORDER BY nickname;
