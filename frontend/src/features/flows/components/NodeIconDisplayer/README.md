# NodeIconDisplayer Component

The NodeIconDisplayer component is used to display different types of node icons based on the icon specification from the backend.

## Usage

```tsx
import { NodeIconDisplayer } from '@/features/flows/components/NodeIconDisplayer';

// Example with iconify icon
<NodeIconDisplayer 
  icon={{
    icon_type: 'iconify',
    icon_value: 'lucide:calculator',
    color: '#3b82f6'
  }}
  size={24}
/>

// Example with emoji
<NodeIconDisplayer 
  icon={{
    icon_type: 'emoji',
    icon_value: '🧠',
    color: '#10b981'
  }}
/>

// Example with HTTP URL
<NodeIconDisplayer 
  icon={{
    icon_type: 'http',
    icon_value: 'https://example.com/icon.svg'
  }}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| icon | `NodeIconData` | Yes | - | The icon data object |
| className | `string` | No | - | Additional CSS classes |
| size | `number \| string` | No | `24` | The size of the icon in pixels or CSS value |

## NodeIconData Type

```typescript
interface NodeIconData {
  icon_type: NodeIconType;
  icon_value: string;
  color?: string | null;
}

type NodeIconType = 
  | 'http'
  | 'emoji'
  | 'fontawesome'
  | 'material'
  | 'iconify'
  | 'svg';
```

## Supported Icon Types

1. **http**: URLs to images or SVGs
2. **emoji**: Emoji characters (e.g., 🧠)
3. **fontawesome**: Font Awesome icons (requires FontAwesome library)
4. **material**: Material Icons (requires Material Icons library)
5. **iconify**: Iconify icons (e.g., lucide:calculator)
6. **svg**: Inline SVG strings

## Notes

- For FontAwesome, Material Icons, and Iconify, the respective libraries need to be installed in the project.
- The component includes fallbacks for when these libraries are not available.
- For SVG icons, the component performs basic validation to ensure the string starts with `<svg` to prevent XSS issues.