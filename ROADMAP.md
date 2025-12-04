# Development Roadmap

## ✅ Phase 1: Foundation (COMPLETED)

- [x] Initialize Next.js 16 project with TypeScript
- [x] Set up Tailwind CSS v4
- [x] Configure Supabase integration
- [x] Create database schema with all tables
- [x] Seed 2026 riders (22 riders)
- [x] Seed 2026 race calendar (22 races)
- [x] Implement passphrase authentication
- [x] Build rider selection component
- [x] Create prediction form
- [x] Implement deadline enforcement
- [x] Build dashboard page
- [x] Create leaderboard view
- [x] Add races calendar page

## 🚧 Phase 2: Core Features (NEXT UP)

### Admin Panel
- [ ] Create admin authentication check
- [ ] Build admin dashboard page
- [ ] Race results entry form
  - [ ] Sprint results input
  - [ ] Main race results input
  - [ ] Validation for position uniqueness
- [ ] Manual score calculation trigger
- [ ] Player management interface
  - [ ] Create new players
  - [ ] Reset player passphrases
  - [ ] Apply manual penalties

### Scoring Engine
- [x] Implement automatic score calculation
  - [x] Calculate sprint winner points
  - [x] Calculate race winner points
  - [x] Calculate glorious 7 points
  - [x] Track and apply late submission penalties
- [x] Create scoring API endpoints
  - [x] POST /api/scores/calculate - Calculate and store scores
  - [x] GET /api/scores/calculate - Preview score calculation
  - [x] GET /api/scores/breakdown - Get detailed score breakdown
  - [x] GET /api/scores/history - Get player historical scores
- [x] Build score breakdown component
- [x] Add historical score tracking

### Championship Predictions
- [ ] Championship prediction form
- [ ] Lock predictions before first race
- [ ] End-of-season championship scoring
- [ ] Display championship predictions on dashboard

## 📈 Phase 3: Polish & UX (FUTURE)

### User Experience
- [ ] Add loading skeletons
- [ ] Improve error messages
- [ ] Add success animations
- [ ] Countdown timer component (live updates)
- [ ] Race card component with better styling
- [ ] Mobile-responsive improvements
- [ ] Dark mode refinements

### Data Visualization
- [ ] Player performance charts
- [ ] Points progression over season
- [ ] Head-to-head comparisons
- [ ] Prediction accuracy statistics

### Notifications
- [ ] Email reminders for upcoming deadlines
- [ ] Browser push notifications
- [ ] Webhook for Discord/Slack integration

## 🚀 Phase 4: Advanced Features (NICE TO HAVE)

### Results Automation
- [ ] MotoGP results web scraper
  - [ ] Scrape from motogp.com
  - [ ] Automatic result import
  - [ ] Manual review/approval flow
- [ ] Alternative: Ergast API integration
- [ ] Scheduled jobs for result fetching

### Real-time Features
- [ ] Supabase real-time subscriptions
  - [ ] Live leaderboard updates
  - [ ] Real-time prediction submissions
  - [ ] Live race status updates
- [ ] WebSocket connection management

### Social Features
- [ ] Player profiles
- [ ] Prediction comments/trash talk
- [ ] Share predictions on social media
- [ ] League creation (multiple betting groups)

### Analytics
- [ ] Admin analytics dashboard
- [ ] Most predicted riders
- [ ] Accuracy trends
- [ ] Participation rates

## 🔒 Phase 5: Production Hardening (BEFORE LAUNCH)

### Security
- [ ] Implement proper password hashing (bcrypt/argon2)
- [ ] Tighten Row Level Security policies
- [ ] Add rate limiting on API routes
- [ ] CSRF protection
- [ ] Input sanitization
- [ ] SQL injection prevention audit

### Performance
- [ ] Optimize database queries
- [ ] Add database indexes for common queries
- [ ] Implement caching strategy
- [ ] Image optimization for rider photos
- [ ] Bundle size optimization

### Testing
- [ ] Unit tests for scoring logic
- [ ] Integration tests for API routes
- [ ] E2E tests for critical flows
- [ ] Load testing
- [ ] Cross-browser testing

### Deployment
- [ ] Set up CI/CD pipeline
- [ ] Environment-specific configs
- [ ] Database backup strategy
- [ ] Monitoring and logging
- [ ] Error tracking (Sentry)
- [ ] Analytics (Vercel Analytics)

## 📱 Phase 6: Mobile App (OPTIONAL)

- [ ] Progressive Web App (PWA)
  - [ ] Add service worker
  - [ ] Offline support
  - [ ] Install prompt
- [ ] React Native app
  - [ ] iOS version
  - [ ] Android version
  - [ ] Push notifications

## 🎯 Priority Order

### Before 2026 Season Starts
1. Admin panel for results entry
2. Scoring engine implementation
3. Championship prediction form
4. Security hardening
5. Production deployment

### During Season
1. Real-time leaderboard updates
2. Notification system
3. Results automation
4. Performance optimizations

### Post-Season
1. Historical data archive
2. Season statistics
3. 2026 season preparation
4. Mobile app development

## Estimated Timeline

- **Phase 2**: 2-3 weeks
- **Phase 3**: 1-2 weeks
- **Phase 4**: 3-4 weeks
- **Phase 5**: 1-2 weeks
- **Phase 6**: 4-6 weeks (if pursued)

**Target Launch**: Before 2026 Thailand GP (March 1, 2026)

## Success Metrics

- All 9 players actively making predictions
- 90%+ prediction submission rate
- Zero scoring errors
- < 2 second page load times
- Mobile usage > 50%

---

**Note**: This roadmap is flexible and priorities may shift based on user feedback and time constraints. The goal is to have a fully functional betting system before the 2026 season begins.
