-- 月度配额重置机制
-- 此脚本需要在 Supabase SQL Editor 中执行

-- 创建重置函数
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    emails_used_this_month = 0,
    last_usage_reset = NOW()
  WHERE subscription_tier != 'business';
END;
$$ LANGUAGE plpgsql;

-- 调度：每月 1 日 00:00 执行
-- 注意：如果任务已存在，先删除旧任务
SELECT cron.unschedule('reset-monthly-usage');

SELECT cron.schedule(
  'reset-monthly-usage',
  '0 0 1 * *',
  $$SELECT reset_monthly_usage()$$
);

-- 验证调度
SELECT cron.jobid, jobname, schedule, command
FROM cron.job;
