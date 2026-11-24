import AppKit
import ImageIO
import UniformTypeIdentifiers

guard CommandLine.arguments.count == 2 else {
    fatalError("Usage: swift scripts/store/make-play-graphics.swift <output-dir>")
}

let output = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true)
let icon = NSImage(contentsOfFile: "ios/InnoPrototype/Images.xcassets/AppIcon.appiconset/icon-1024.png")!
let logo = NSImage(contentsOfFile: "src/assets/images/inno-wordmark.png")!

func color(_ hex: Int) -> NSColor {
    NSColor(srgbRed: Double(hex >> 16 & 255) / 255,
            green: Double(hex >> 8 & 255) / 255,
            blue: Double(hex & 255) / 255, alpha: 1)
}

func fill(_ bounds: NSRect, _ color: NSColor) {
    color.setFill()
    bounds.fill()
}

func label(_ value: String, x: Int, y: Int, size: CGFloat,
           weight: NSFont.Weight, ink: NSColor) {
    NSAttributedString(string: value, attributes: [
        .font: NSFont.systemFont(ofSize: size, weight: weight),
        .foregroundColor: ink,
    ]).draw(at: NSPoint(x: x, y: y))
}

func png(_ name: String, width: Int, height: Int, alpha: Bool, draw: () -> Void) {
    let space = CGColorSpace(name: CGColorSpace.sRGB)!
    let mode: CGImageAlphaInfo = alpha ? .premultipliedLast : .noneSkipLast
    let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8,
                            bytesPerRow: 0, space: space, bitmapInfo: mode.rawValue)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)
    context.interpolationQuality = .high
    draw()
    NSGraphicsContext.restoreGraphicsState()
    let path = output.appendingPathComponent(name)
    let destination = CGImageDestinationCreateWithURL(path as CFURL, UTType.png.identifier as CFString, 1, nil)!
    CGImageDestinationAddImage(destination, context.makeImage()!, nil)
    precondition(CGImageDestinationFinalize(destination), "Could not write \(path.path)")
}

png("play-icon-512.png", width: 512, height: 512, alpha: true) {
    icon.draw(in: NSRect(x: 0, y: 0, width: 512, height: 512))
}

png("play-feature-1024x500.png", width: 1024, height: 500, alpha: false) {
    fill(NSRect(x: 0, y: 0, width: 1024, height: 500), color(0xF6F7F8))
    fill(NSRect(x: 0, y: 0, width: 1024, height: 10), color(0x006789))
    fill(NSRect(x: 76, y: 346, width: 52, height: 5), color(0xD51F33))
    label("İnno Derneği", x: 76, y: 249, size: 67, weight: .bold, ink: color(0x20272C))
    label("ESC ve Erasmus başvuruları", x: 78, y: 190, size: 31,
          weight: .medium, ink: color(0x006789))
    fill(NSRect(x: 634, y: 176, width: 314, height: 148), .white)
    logo.draw(in: NSRect(x: 649, y: 191, width: 284, height: 118))
}
