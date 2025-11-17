# Google Calendar Setup Guide

## Quick Setup Checklist

### 1. Environment Configuration ✅ DONE
```bash
# Already added to .env
GOOGLE_CALENDAR_ID=mj@venturesquare.net
```

### 2. Google Service Account Setup (TODO)

#### Step 1: Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to "IAM & Admin" > "Service Accounts"
4. Click "Create Service Account"
5. Name it (e.g., "vs-ams-calendar-sync")
6. Grant role: "Editor" or "Owner"
7. Click "Done"

#### Step 2: Create Service Account Key
1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the key file
6. Save it as `server/google-credentials.json`

#### Step 3: Enable Google Calendar API
1. In Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click "Enable"

#### Step 4: Share Calendar with Service Account
1. Open Google Calendar (https://calendar.google.com)
2. Navigate to the calendar `mj@venturesquare.net`
3. Click the three dots next to the calendar
4. Click "Settings and sharing"
5. Scroll to "Share with specific people"
6. Click "Add people"
7. Enter the service account email from step 2 (looks like: `vs-ams-calendar-sync@project-id.iam.gserviceaccount.com`)
8. Set permission to "Make changes to events"
9. Click "Send"

### 3. Verify Service Account Email in .env (TODO)

Add this to `.env`:
```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
```

### 4. Test the Integration

#### Test Campaign Creation
```bash
# Using curl
curl -X POST http://localhost:5000/api/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "campaignName": "Test Campaign",
    "advertiserId": "ADVERTISER_ID",
    "startDate": "2024-12-01",
    "endDate": "2024-12-31",
    "status": "Planning"
  }'
```

#### Check Server Logs
Look for:
```
✅ Campaign {id} synced to Google Calendar: {eventId}
```

#### Verify in Google Calendar
1. Go to https://calendar.google.com
2. Switch to `mj@venturesquare.net` calendar
3. Check for the event "[Campaign] Test Campaign"

### 5. Troubleshooting

#### Problem: Calendar events not appearing

**Check 1: Service Account Email**
```bash
# Verify service account email in .env
grep GOOGLE_SERVICE_ACCOUNT_EMAIL .env
```

**Check 2: Calendar Sharing**
- Ensure the service account email is added to the calendar with "Make changes to events" permission

**Check 3: API Enabled**
- Verify Google Calendar API is enabled in GCP project

**Check 4: Credentials File**
```bash
# Check if credentials file exists
ls -la server/google-credentials.json
```

**Check 5: Server Logs**
```bash
# Check for errors
tail -f logs/server.log | grep -i calendar
```

#### Problem: "401 Unauthorized" error

**Solution**: 
1. Regenerate service account key
2. Replace `server/google-credentials.json`
3. Restart server

#### Problem: "403 Forbidden" error

**Solution**:
1. Verify calendar is shared with service account
2. Check permission is "Make changes to events"
3. Re-share if necessary

#### Problem: "404 Not Found" when updating/deleting

**Solution**:
- Event might have been manually deleted from calendar
- Campaign will continue to work normally (graceful degradation)
- Check server logs for warnings

## Environment Variables Reference

```bash
# Required
GOOGLE_CALENDAR_ID=mj@venturesquare.net

# Optional (for logging/debugging)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
```

## Calendar Event Format

### Event Title
```
[Campaign] Campaign Name
```

### Event Description
```
Campaign Status: Active

Advertiser: Company Name
- CEO: CEO Name
- Phone: 010-1234-5678
- Email: contact@company.com

Ad Products:
- Product 1 (Platform 1): ₩1,000,000
- Product 2 (Platform 2): ₩500,000

UTM Campaign: campaign-id
```

### Event Dates
- All-day events
- Start: Campaign start date
- End: Campaign end date

### Event Location
- Advertiser company name

## API Rate Limits

Google Calendar API has the following limits:
- **Queries per day**: 1,000,000
- **Queries per 100 seconds per user**: 50,000

For VS-AMS typical usage (< 1000 campaigns/day), these limits are more than sufficient.

## Monitoring

### Success Indicators
- Server logs show: `✅ Campaign {id} synced to Google Calendar`
- Events appear in Google Calendar
- Campaign records have `Google Calendar ID` field populated

### Warning Indicators
- Server logs show: `⚠️ Failed to sync campaign to Google Calendar`
- Campaign operations still succeed
- Manual calendar sync may be needed

## Backup and Recovery

### If Calendar Sync Fails
1. Campaign data is safe in Airtable
2. Calendar events can be manually created
3. Or re-sync by updating the campaign (will create/update event)

### Manual Re-sync Process
For campaigns missing calendar events:
1. Open campaign in VS-AMS
2. Make a minor edit (e.g., add a space to campaign name)
3. Save the campaign
4. This will trigger calendar event creation

## Security Best Practices

1. **Keep credentials secure**
   - Never commit `google-credentials.json` to git
   - Already added to `.gitignore`

2. **Limit service account permissions**
   - Only grant Calendar access
   - Don't use personal account credentials

3. **Rotate credentials periodically**
   - Create new service account key every 90 days
   - Delete old keys

4. **Monitor API usage**
   - Check Google Cloud Console for unusual activity
   - Set up billing alerts

## Related Documentation

- [GOOGLE_CALENDAR_INTEGRATION.md](GOOGLE_CALENDAR_INTEGRATION.md) - Complete integration documentation
- [Google Calendar API Authentication](https://developers.google.com/calendar/api/guides/auth)
- [Service Account Setup](https://cloud.google.com/iam/docs/service-accounts)

## Support

For issues or questions:
1. Check server logs for specific error messages
2. Refer to troubleshooting section above
3. Review Google Calendar API documentation
4. Check Airtable campaign records for `Google Calendar ID` field

---

Last Updated: 2024-11-16
