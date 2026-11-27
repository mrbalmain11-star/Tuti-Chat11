select cron.alter_job(jobid, schedule := '1 second') from cron.job where jobname = 'totichat-food-settlement';
