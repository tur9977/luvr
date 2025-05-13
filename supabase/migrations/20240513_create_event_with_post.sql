-- 創建一個函數來處理創建活動和貼文的事務
CREATE OR REPLACE FUNCTION create_event_with_post(
  p_user_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_date TIMESTAMPTZ,
  p_location TEXT,
  p_status TEXT,
  p_category TEXT,
  p_post_content TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_result JSONB;
BEGIN
  -- 開始事務
  BEGIN
    -- 創建活動
    INSERT INTO events (
      user_id,
      title,
      description,
      date,
      location,
      status,
      category,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_title,
      p_description,
      p_date,
      p_location,
      p_status,
      p_category,
      NOW(),
      NOW()
    ) RETURNING id INTO v_event_id;

    -- 創建相關貼文
    INSERT INTO posts (
      user_id,
      content,
      event_id,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_post_content,
      v_event_id,
      NOW(),
      NOW()
    );

    -- 獲取完整的活動信息
    SELECT jsonb_build_object(
      'event', e,
      'post', p
    ) INTO v_result
    FROM events e
    LEFT JOIN posts p ON p.event_id = e.id
    WHERE e.id = v_event_id;

    -- 提交事務
    RETURN v_result;
  EXCEPTION
    WHEN OTHERS THEN
      -- 回滾事務
      RAISE EXCEPTION 'Failed to create event and post: %', SQLERRM;
  END;
END;
$$; 