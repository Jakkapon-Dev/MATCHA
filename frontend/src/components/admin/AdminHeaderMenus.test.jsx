import React from 'react';
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import AdminNotificationsMenu from './AdminNotificationsMenu';
import AdminExportMenu from './AdminExportMenu';

afterEach(cleanup);

describe('AdminNotificationsMenu', () => {
  const sampleNotifications = [
    {
      id: 'notif-1',
      orderNumber: 'ORD-001',
      total: 120,
      customerName: 'Alice',
      read: false,
      createdAt: '2026-09-25T10:00:00.000Z'
    }
  ];

  test('renders bell button and badge when unreadCount > 0', () => {
    render(
      <AdminNotificationsMenu
        notifications={sampleNotifications}
        unreadCount={1}
      />
    );

    const button = screen.getByRole('button', { name: /order notifications/i });
    expect(button).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });

  test('toggles dropdown and handles mark read callbacks', () => {
    const handleMarkRead = vi.fn();
    const handleMarkAllRead = vi.fn();

    render(
      <AdminNotificationsMenu
        notifications={sampleNotifications}
        unreadCount={1}
        onMarkNotificationRead={handleMarkRead}
        onMarkAllNotificationsRead={handleMarkAllRead}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /order notifications/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText('New Orders')).toBeTruthy();
    expect(screen.getByText('ORD-001')).toBeTruthy();
    expect(screen.getByText(/Alice/)).toBeTruthy();

    const markAllBtn = screen.getByRole('button', { name: /mark all read/i });
    fireEvent.click(markAllBtn);
    expect(handleMarkAllRead).toHaveBeenCalled();

    const notifItem = screen.getByText('ORD-001');
    fireEvent.click(notifItem);
    expect(handleMarkRead).toHaveBeenCalledWith(sampleNotifications[0]);
  });
});

describe('AdminExportMenu', () => {
  test('toggles dropdown and handles export actions', () => {
    const handleExportInventory = vi.fn();
    const handleExportOrders = vi.fn();
    const handleExportFullJSON = vi.fn();

    render(
      <AdminExportMenu
        onExportInventory={handleExportInventory}
        onExportOrders={handleExportOrders}
        onExportFullJSON={handleExportFullJSON}
      />
    );

    const toggleBtn = screen.getByRole('button', { name: /export data/i });
    fireEvent.click(toggleBtn);

    expect(screen.getByText('Inventory CSV')).toBeTruthy();
    expect(screen.getByText('Orders Pipeline CSV')).toBeTruthy();
    expect(screen.getByText('Admin Data Export (JSON)')).toBeTruthy();

    fireEvent.click(screen.getByText('Inventory CSV'));
    expect(handleExportInventory).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Orders Pipeline CSV'));
    expect(handleExportOrders).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Admin Data Export (JSON)'));
    expect(handleExportFullJSON).toHaveBeenCalled();
  });
});
