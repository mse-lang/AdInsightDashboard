# Google Calendar Integration

## Overview

VS-AMS now features automatic bidirectional synchronization between campaigns and Google Calendar. When campaigns are created, updated, or deleted, the corresponding calendar events are automatically managed.

## Configuration

### Calendar ID
- **Configured Calendar**: `mj@venturesquare.net`
- **Environment Variable**: `GOOGLE_CALENDAR_ID` in `.env`
- **Calendar URL**: https://calendar.google.com/calendar/u/1?cid=bWpAdmVudHVyZXNxdWFyZS5uZXQ

### Setup Requirements

1. **Google Calendar API Credentials**
   - Service account JSON credentials must be configured
   - Calendar must be shared with the service account email
   - Required scopes: `https://www.googleapis.com/auth/calendar`

2. **Environment Variables**
   ```bash
   GOOGLE_CALENDAR_ID=mj@venturesquare.net
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   # Service account credentials should be in server/google-credentials.json
   ```

## Features

### Automatic Campaign-Calendar Sync

#### 1. Campaign Creation → Calendar Event Creation
- **Trigger**: POST `/api/campaigns`
- **Action**: Automatically creates Google Calendar event
- **Event Details**:
  - **Title**: `[Campaign] {Campaign Name}`
  - **Start/End**: Campaign start and end dates (all-day events)
  - **Description**: Rich description including:
    - Campaign status
    - Advertiser information (name, contact, email)
    - Ad products with pricing
    - UTM campaign identifier
  - **Location**: Advertiser company name
- **Database Update**: Stores calendar event ID in campaign's `Google Calendar ID` field
- **Error Handling**: Graceful degradation - calendar sync failure doesn't block campaign creation

#### 2. Campaign Update → Calendar Event Update
- **Trigger**: PATCH `/api/campaigns/:id`
- **Condition**: Only if campaign has existing `Google Calendar ID`
- **Action**: Updates corresponding calendar event with new data
- **Updated Fields**:
  - Event title (campaign name)
  - Event dates (start/end)
  - Description (status, advertiser, products)
  - Location (advertiser company)
- **Error Handling**: Campaign update succeeds even if calendar update fails

#### 3. Campaign Deletion → Calendar Event Deletion
- **Trigger**: DELETE `/api/campaigns/:id`
- **Action**: Automatically deletes corresponding calendar event
- **Process**:
  1. Retrieve campaign to get `Google Calendar ID`
  2. Delete campaign from Airtable
  3. Delete event from Google Calendar
- **Error Handling**: Campaign deletion succeeds even if calendar deletion fails

### Calendar Display
- **Page**: `/calendar` route
- **Component**: `client/src/pages/calendar.tsx`
- **Display**: Embedded Google Calendar iframe
- **Settings**:
  - Month view by default
  - Asia/Seoul timezone
  - Shows navigation, date, title
  - Hides print, tabs, calendars selector

## Implementation Details

### Service Layer
**File**: `server/services/google-calendar.service.ts`

#### Functions

1. **`getCalendarId()`**
   - Returns configured calendar ID from environment or 'primary' as fallback
   ```typescript
   function getCalendarId(): string {
     return process.env.GOOGLE_CALENDAR_ID || 'primary';
   }
   ```

2. **`createCampaignEvent(campaign, advertiser, adProducts, calendarId?)`**
   - Creates new calendar event from campaign data
   - Uses environment calendar ID if not specified
   - Returns: `CalendarEvent` with event ID

3. **`updateCampaignEvent(eventId, campaign, advertiser, adProducts, calendarId?)`**
   - Updates existing calendar event
   - Uses environment calendar ID if not specified
   - Returns: Updated `CalendarEvent`

4. **`deleteCampaignEvent(eventId, calendarId?)`**
   - Deletes calendar event by ID
   - Uses environment calendar ID if not specified
   - Returns: Success boolean

### API Routes
**File**: `server/routes.ts`

#### Campaign Creation (lines 861-893)
```typescript
// After creating campaign
const campaign = await campaignsTable.createCampaign(data);

// Auto-sync to Google Calendar
try {
  // Fetch advertiser and ad products
  // Create calendar event
  const calendarEvent = await googleCalendarService.createCampaignEvent(
    campaign, advertiser, adProducts
  );
  
  // Store calendar event ID in campaign
  await campaignsTable.updateCampaign(campaign.id, {
    googleCalendarId: calendarEvent.id,
  });
  
  console.log(`✅ Campaign ${campaign.id} synced to Google Calendar: ${calendarEvent.id}`);
} catch (calendarError) {
  console.warn('⚠️ Failed to sync campaign to Google Calendar:', calendarError);
  // Don't fail campaign creation
}
```

#### Campaign Update (lines 896-985)
```typescript
const campaign = await campaignsTable.updateCampaign(req.params.id, data);

// Auto-sync to Google Calendar if already synced
if (campaign.fields['Google Calendar ID']) {
  try {
    // Fetch advertiser and ad products
    // Update calendar event
    await googleCalendarService.updateCampaignEvent(
      campaign.fields['Google Calendar ID'],
      campaign, advertiser, adProducts
    );
    
    console.log(`✅ Campaign ${campaign.id} updated in Google Calendar`);
  } catch (calendarError) {
    console.warn('⚠️ Failed to update campaign in Google Calendar:', calendarError);
    // Don't fail campaign update
  }
}
```

#### Campaign Deletion (lines 1008-1043)
```typescript
// Get campaign first to check for Google Calendar ID
const campaign = await campaignsTable.getCampaignById(req.params.id);

const success = await campaignsTable.deleteCampaign(req.params.id);

// Auto-delete from Google Calendar if it was synced
if (campaign?.fields['Google Calendar ID']) {
  try {
    await googleCalendarService.deleteCampaignEvent(
      campaign.fields['Google Calendar ID']
    );
    console.log(`✅ Campaign ${campaign.id} deleted from Google Calendar`);
  } catch (calendarError) {
    console.warn('⚠️ Failed to delete campaign from Google Calendar:', calendarError);
    // Don't fail campaign deletion
  }
}
```

## Event Description Format

Calendar events include a rich description with all campaign details:

```
Campaign Status: Active

Advertiser: Company Name
- CEO: CEO Name
- Phone: 010-1234-5678
- Email: contact@company.com

Ad Products:
- Product Name 1 (Platform 1): ₩1,000,000
- Product Name 2 (Platform 2): ₩500,000

UTM Campaign: campaign-identifier
```

## Error Handling Philosophy

**Graceful Degradation**: Calendar synchronization failures never block core campaign operations.

- ✅ **Campaign Creation**: Succeeds even if calendar event creation fails
- ✅ **Campaign Update**: Succeeds even if calendar event update fails
- ✅ **Campaign Deletion**: Succeeds even if calendar event deletion fails

All errors are logged with warning level (`console.warn`) for debugging without failing the request.

## Testing Checklist

### Prerequisites
- [ ] Google Calendar API credentials configured
- [ ] Service account has calendar access
- [ ] `GOOGLE_CALENDAR_ID` set in `.env`
- [ ] Server restarted after environment changes

### Campaign Creation
- [ ] Create new campaign with advertiser and products
- [ ] Verify calendar event appears in Google Calendar
- [ ] Check event title includes `[Campaign]` prefix
- [ ] Verify dates match campaign start/end
- [ ] Confirm description includes all details
- [ ] Check campaign record has `Google Calendar ID` populated

### Campaign Update
- [ ] Update campaign name → verify event title updates
- [ ] Change dates → verify event dates update
- [ ] Update advertiser → verify description updates
- [ ] Change products → verify description updates
- [ ] Update status → verify description updates

### Campaign Deletion
- [ ] Delete campaign
- [ ] Verify calendar event is removed
- [ ] Confirm no orphaned events remain

### Calendar Display
- [ ] Navigate to `/calendar` page
- [ ] Verify calendar loads with correct view
- [ ] Check timezone is Asia/Seoul
- [ ] Confirm events display correctly

### Error Scenarios
- [ ] Calendar API unavailable → campaign operations still work
- [ ] Invalid calendar ID → operations succeed with warning
- [ ] Network timeout → operations complete gracefully

## Monitoring

### Success Logs
```
✅ Campaign {id} synced to Google Calendar: {eventId}
✅ Campaign {id} updated in Google Calendar
✅ Campaign {id} deleted from Google Calendar
```

### Warning Logs
```
⚠️ Failed to sync campaign to Google Calendar: {error}
⚠️ Failed to update campaign in Google Calendar: {error}
⚠️ Failed to delete campaign from Google Calendar: {error}
```

## Future Enhancements

### Potential Improvements
1. **Bidirectional Sync**: Listen to calendar webhooks for manual calendar edits
2. **Conflict Resolution**: Handle cases where calendar events are manually modified
3. **Batch Operations**: Optimize multiple campaign operations
4. **Calendar Selection**: Allow users to choose different calendars per campaign
5. **Event Colors**: Use different colors for campaign statuses
6. **Reminders**: Add calendar reminders for campaign start/end dates
7. **Recurring Events**: Support for recurring campaigns

### Known Limitations
1. **One-way Sync**: Changes made directly in Google Calendar won't update campaigns
2. **Manual Events**: Non-campaign events in the calendar are unaffected
3. **Rate Limits**: Google Calendar API has usage quotas (consider for bulk operations)
4. **Time Zones**: All dates treated as all-day events (no time-specific scheduling)

## Troubleshooting

### Calendar events not appearing
1. Check `GOOGLE_CALENDAR_ID` in `.env`
2. Verify service account has calendar access (shared with write permission)
3. Check server logs for error messages
4. Confirm Google Calendar API is enabled in GCP project

### Calendar updates not syncing
1. Verify campaign has `Google Calendar ID` field populated
2. Check that calendar event still exists (not manually deleted)
3. Review server logs for warning messages

### Calendar page not loading
1. Check calendar ID in `client/src/pages/calendar.tsx`
2. Verify calendar is publicly accessible or shared with users
3. Check browser console for iframe errors

## Related Documentation

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Service Account Authentication](https://developers.google.com/identity/protocols/oauth2/service-account)
- VS-AMS Campaign Management Guide
- API Endpoints Documentation

## Version History

- **v1.0** (2024-01-16): Initial implementation
  - Auto-create calendar events on campaign creation
  - Auto-update calendar events on campaign updates
  - Auto-delete calendar events on campaign deletion
  - Environment-based calendar configuration
  - Graceful error handling
